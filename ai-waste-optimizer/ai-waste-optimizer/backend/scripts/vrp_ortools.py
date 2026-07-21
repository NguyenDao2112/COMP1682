# vrp_ortools.py
import pandas as pd
import math
import random
import csv
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

# 1. Load bin data
df = pd.read_csv("D:/COMP1682/ai-waste-optimizer/data/simulated_bins.csv")

# Take average coordinates and fill level per bin
bins = df.groupby("bin_id")[["lat", "lon", "fill_level"]].mean().reset_index()

# Add simulated waste volume per bin (based on fill level)
bins["waste_volume"] = bins["fill_level"] * random.uniform(0.8, 1.2)

# 2. Build distance matrix (Euclidean distance)
def compute_euclidean_distance_matrix(locations):
    size = len(locations)
    matrix = {}
    for from_node in range(size):
        matrix[from_node] = {}
        for to_node in range(size):
            if from_node == to_node:
                matrix[from_node][to_node] = 0
            else:
                dx = locations[from_node][0] - locations[to_node][0]
                dy = locations[from_node][1] - locations[to_node][1]
                matrix[from_node][to_node] = int(math.hypot(dx, dy) * 100000)
    return matrix

locations = list(zip(bins["lat"], bins["lon"]))
distance_matrix = compute_euclidean_distance_matrix(locations)

# 3. Setup VRP
num_vehicles = 3
depot = 0
vehicle_capacities = [2000, 2000, 2000]  # kg per truck
demands = [int(v) for v in bins["waste_volume"]]

manager = pywrapcp.RoutingIndexManager(len(distance_matrix), num_vehicles, depot)
routing = pywrapcp.RoutingModel(manager)

# Distance callback
def distance_callback(from_index, to_index):
    from_node = manager.IndexToNode(from_index)
    to_node = manager.IndexToNode(to_index)
    return distance_matrix[from_node][to_node]

transit_callback_index = routing.RegisterTransitCallback(distance_callback)
routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

# 4. Add capacity constraint
def demand_callback(from_index):
    from_node = manager.IndexToNode(from_index)
    return demands[from_node]

demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
routing.AddDimensionWithVehicleCapacity(
    demand_callback_index,
    0,  # no slack
    vehicle_capacities,
    True,  # start cumul to zero
    "Capacity"
)

# 5. Solve
search_parameters = pywrapcp.DefaultRoutingSearchParameters()
search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC

solution = routing.SolveWithParameters(search_parameters)

# 6. Print and save solution
if solution:
    print("✅ Solution found!")

    # Prepare CSV file
    output_file = "D:/COMP1682/ai-waste-optimizer/data/optimized_routes.csv"
    with open(output_file, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["truck_id", "route", "load", "distance_km"])

        for vehicle_id in range(num_vehicles):
            index = routing.Start(vehicle_id)
            route = []
            load = 0
            distance = 0
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                route.append(node_index)
                load += demands[node_index]
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                distance += distance_matrix[node_index][manager.IndexToNode(index)]
            route.append(depot)
            distance_km = distance / 100000
            print(f"Truck {vehicle_id} route: {route} | Load: {load} kg | Distance: {distance_km:.2f} km")
            writer.writerow([vehicle_id, route, load, f"{distance_km:.2f}"])
    print(f"📁 Routes saved to {output_file}")
else:
    print("❌ No solution found.")

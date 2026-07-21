$url = "http://127.0.0.1:8000/health"
$req = [System.Net.WebRequest]::Create($url)
$req.Timeout = 5000
try {
    $resp = $req.GetResponse()
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    Write-Host "Backend Health Check: $text"
    $reader.Close()
    $resp.Close()
    exit 0
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}

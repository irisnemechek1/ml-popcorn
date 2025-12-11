using System.Diagnostics;

public class PythonService
{
    private string pythonPath = @"C:\Users\sydne\AppData\Local\Microsoft\WindowsApps\python.exe";
    private string scriptPath = @"../MLmodel/service.py";

    public double GetSentimentScore(string text)
{
    var start = new ProcessStartInfo
    {
        FileName = pythonPath,
        Arguments = $"\"{scriptPath}\" \"{text}\"",
        UseShellExecute = false,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        CreateNoWindow = true
    };

    using var process = Process.Start(start);

    string rawOut = process.StandardOutput.ReadToEnd();
    string rawErr = process.StandardError.ReadToEnd();
    process.WaitForExit();

    Console.WriteLine("===== PYTHON STDOUT =====");
    Console.WriteLine(rawOut);
    Console.WriteLine("===== PYTHON STDERR =====");
    Console.WriteLine(rawErr);

    // Extract the JSON from stdout
    string? jsonLine = rawOut
        .Split('\n')
        .FirstOrDefault(l => l.Trim().StartsWith("{"));

    if (jsonLine == null)
        throw new Exception("No JSON returned from Python");

    var scoreObj = System.Text.Json.JsonSerializer.Deserialize<PythonResponse>(
        jsonLine,
        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
    );

    return scoreObj?.Score ?? 0;
}


    private class PythonResponse
    {
        public double Score { get; set; }
    }
}

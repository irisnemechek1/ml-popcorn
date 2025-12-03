using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/sentiment")]
    public class SentimentController : ControllerBase
    {
        [HttpPost("analyze")]
        public IActionResult Analyze([FromBody] SentimentRequest request)
        {
            try
            {
                string python = @"C:\Users\irism_npx8lts\AppData\Local\Programs\Python\Python312\python.exe";
                string script = @"C:\Users\irism_npx8lts\Desktop\MLpopcorn\popcorn_dashboard\MLmodel\service.py";

                var psi = new ProcessStartInfo
                {
                    FileName = python,
                    Arguments = $"\"{script}\" \"{request.Text}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                var proc = Process.Start(psi);
                string output = proc.StandardOutput.ReadToEnd();
                string errors = proc.StandardError.ReadToEnd();
                proc.WaitForExit();

                if (!string.IsNullOrWhiteSpace(errors))
                    return StatusCode(500, errors);

                return Content(output, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }

    public class SentimentRequest
    {
        public string Text { get; set; }
    }
}

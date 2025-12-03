using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Allow React frontend to call the API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") // your React frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register Python service
builder.Services.AddSingleton<PythonService>();

var app = builder.Build();

// Configure Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors();

app.UseHttpsRedirection();

// SENTIMENT ENDPOINT
app.MapPost("/api/sentiment/analyze", (SentimentRequest req, PythonService py) =>
{
    double score = py.GetSentimentScore(req.Text);
    return Results.Ok(new { score });
})
.WithName("AnalyzeSentiment")
.WithOpenApi();

app.Run();

// ---- MODELS ----
public record SentimentRequest(string Text);

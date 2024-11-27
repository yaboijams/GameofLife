using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models; // Required for Swagger
using GameOfLife.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Game of Life API",
        Version = "v1"
    });
});

// Register GameDbContext (if using EF Core)
builder.Services.AddDbContext<GameDbContext>(options =>
    options.UseSqlite("Data Source=gameoflife.db"));

// Configure CORS to allow requests from frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Game of Life API v1");
    });
}

// Enable CORS
app.UseCors("AllowAll");

// Allow HTTP redirection to work even if HTTPS isn't properly set up
// If you want to disable HTTPS redirection, comment out the following line
app.UseHttpsRedirection();

app.UseAuthorization();
app.MapControllers();

app.Run();

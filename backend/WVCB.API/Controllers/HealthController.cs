using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WVCB.API.Data;

namespace WVCB.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly HealthCheckService _healthCheckService;

        public HealthController(ApplicationDbContext dbContext, HealthCheckService healthCheckService)
        {
            _dbContext = dbContext;
            _healthCheckService = healthCheckService;
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("API is online");
        }

        [HttpGet("database")]
        public async Task<IActionResult> CheckDatabase()
        {
            try
            {
                // Try to execute a simple query
                await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
                return Ok("Database connection is healthy");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Database connection failed: {ex.Message}");
            }
        }

        [HttpGet("memory")]
        public IActionResult CheckMemory()
        {
            var totalMemory = GC.GetTotalMemory(false);
            var memoryInfo = new
            {
                TotalMemoryBytes = totalMemory,
                TotalMemoryMB = Math.Round(totalMemory / (1024.0 * 1024.0), 2)
            };
            return Ok(memoryInfo);
        }

        [HttpGet("full")]
        public async Task<IActionResult> FullHealthCheck()
        {
            var report = await _healthCheckService.CheckHealthAsync();
            return Ok(new
            {
                Status = report.Status.ToString(),
                Checks = report.Entries.Select(e => new
                {
                    Component = e.Key,
                    Status = e.Value.Status.ToString(),
                    Description = e.Value.Description
                })
            });
        }
    }
}
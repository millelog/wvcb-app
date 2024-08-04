using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WVCB.API.Data;
using WVCB.API.Models;

namespace WVCB.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser<Guid>> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly ApplicationDbContext _context;

        public AuthController(
            UserManager<IdentityUser<Guid>> userManager,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
            _context = context;
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var identityUser = await _userManager.FindByNameAsync(model.Username);
            if (identityUser != null && await _userManager.CheckPasswordAsync(identityUser, model.Password))
            {
                var applicationUser = await _context.ApplicationUsers
                    .Include(u => u.Section)
                    .FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id);

                if (applicationUser == null)
                {
                    return BadRequest("No associated application user found.");
                }

                var userRoles = await _userManager.GetRolesAsync(identityUser);

                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, identityUser.UserName),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim("ApplicationUserId", applicationUser.Id.ToString()),
                    new Claim(ClaimTypes.Role, applicationUser.Role.ToString())
                };

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));

                var token = new JwtSecurityToken(
                    issuer: _configuration["JWT:ValidIssuer"],
                    audience: _configuration["JWT:ValidAudience"],
                    expires: DateTime.Now.AddHours(3),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

                // Create a new session
                var session = new Session
                {
                    UserId = applicationUser.Id,
                    ExpiresAt = token.ValidTo,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    LastActive = DateTime.UtcNow
                };

                _context.Sessions.Add(session);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    expiration = token.ValidTo,
                    userId = applicationUser.Id,
                    email = applicationUser.Email,
                    firstName = applicationUser.FirstName,
                    lastName = applicationUser.LastName,
                    role = applicationUser.Role,
                    status = applicationUser.Status,
                    section = applicationUser.Section?.Name,
                    instrument = applicationUser.Instrument,
                    sessionId = session.Id
                });
            }
            return Unauthorized();
        }

        [HttpPost]
        [Route("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            try
            {
                // Check if an IdentityUser with this email already exists
                var identityUser = await _userManager.FindByNameAsync(model.Email);
                if (identityUser != null)
                    return StatusCode(StatusCodes.Status400BadRequest, new { Status = "Error", Message = "User account already exists!" });

                // Check if an ApplicationUser with this email already exists
                var applicationUser = await _context.ApplicationUsers
                    .FirstOrDefaultAsync(u => u.Email == model.Email);

                if (applicationUser == null)
                {
                    // If no ApplicationUser exists, create a new one
                    applicationUser = new ApplicationUser
                    {
                        Id = Guid.NewGuid(), // Explicitly set the Id
                        Email = model.Email,
                        FirstName = model.FirstName,
                        LastName = model.LastName,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Status = UserStatus.Active,
                        Role = UserRole.Guest,
                        JoinDate = DateTime.UtcNow
                    };

                    _context.ApplicationUsers.Add(applicationUser);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // If ApplicationUser exists, update FirstName and LastName if they're different
                    if (applicationUser.FirstName != model.FirstName || applicationUser.LastName != model.LastName)
                    {
                        applicationUser.FirstName = model.FirstName;
                        applicationUser.LastName = model.LastName;
                        applicationUser.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                // Create a new IdentityUser
                identityUser = new IdentityUser<Guid>
                {
                    Id = Guid.NewGuid(), // Explicitly set the Id
                    UserName = model.Email,
                    Email = model.Email,
                };

                var result = await _userManager.CreateAsync(identityUser, model.Password);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    return StatusCode(StatusCodes.Status500InternalServerError, new { Status = "Error", Message = "User account creation failed!", Errors = errors });
                }

                // Associate the IdentityUser with the ApplicationUser
                applicationUser.IdentityUserId = identityUser.Id;
                await _context.SaveChangesAsync();

                // Assign the Member role to the new user
                await _userManager.AddToRoleAsync(identityUser, UserRole.Member.ToString());

                return Ok(new { Status = "Success", Message = "User account created successfully!" });
            }
            catch (Exception ex)
            {
                // Log the exception
                _logger.LogError(ex, "An error occurred during user registration");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Status = "Error", Message = "An unexpected error occurred during registration.", Error = ex.Message });
            }
        }

        [HttpPost]
        [Route("logout")]
        public async Task<IActionResult> Logout([FromBody] Guid sessionId)
        {
            var session = await _context.Sessions.FindAsync(sessionId);
            if (session != null)
            {
                _context.Sessions.Remove(session);
                await _context.SaveChangesAsync();
            }

            return Ok(new { Status = "Success", Message = "Logged out successfully" });
        }
    }
}
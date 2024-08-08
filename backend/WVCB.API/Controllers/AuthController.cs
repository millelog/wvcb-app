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
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.AspNetCore.WebUtilities;
using System.Net;

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
        private readonly ISendGridClient _sendGridClient;
        private readonly IWebHostEnvironment _environment;


        public AuthController(
            UserManager<IdentityUser<Guid>> userManager,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            ApplicationDbContext context,
            ISendGridClient sendGridClient,
            IWebHostEnvironment environment)
        {
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
            _context = context;
            _sendGridClient = sendGridClient;
            _environment = environment;
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var identityUser = await _userManager.FindByNameAsync(model.Username);
            if (identityUser != null && await _userManager.CheckPasswordAsync(identityUser, model.Password))
            {
                if (!await _userManager.IsEmailConfirmedAsync(identityUser))
                {
                    return BadRequest("Email is not confirmed. Please check your email for the confirmation link.");
                }

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

                var session = new Session
                {
                    UserId = applicationUser.Id,
                    ExpiresAt = token.ValidTo,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    LastActive = DateTime.UtcNow,
                    Data = null
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
                var identityUser = await _userManager.FindByNameAsync(model.Email);
                if (identityUser != null)
                    return StatusCode(StatusCodes.Status400BadRequest, new { Status = "Error", Message = "User account already exists!" });

                var applicationUser = await _context.ApplicationUsers
                    .FirstOrDefaultAsync(u => u.Email == model.Email);

                if (applicationUser == null)
                {
                    applicationUser = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
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
                    if (applicationUser.FirstName != model.FirstName || applicationUser.LastName != model.LastName)
                    {
                        applicationUser.FirstName = model.FirstName;
                        applicationUser.LastName = model.LastName;
                        applicationUser.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                identityUser = new IdentityUser<Guid>
                {
                    Id = Guid.NewGuid(),
                    UserName = model.Email,
                    Email = model.Email,
                };

                var result = await _userManager.CreateAsync(identityUser, model.Password);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    return StatusCode(StatusCodes.Status500InternalServerError, new { Status = "Error", Message = "User account creation failed!", Errors = errors });
                }

                applicationUser.IdentityUserId = identityUser.Id;
                await _context.SaveChangesAsync();

                await _userManager.AddToRoleAsync(identityUser, UserRole.Member.ToString());

                // Generate email confirmation token and send email
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(identityUser);
                var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

                var frontendUrl = _configuration[$"FrontendUrls:{(_environment.IsDevelopment() ? "Development" : "Production")}"];
                var confirmationLink = $"{frontendUrl}/confirm-email?userId={identityUser.Id}&token={encodedToken}";

                await SendEmailAsync(identityUser.Email, "Confirm your email", $"Please confirm your account by clicking this link: <a href='{confirmationLink}'>Confirm Email</a>");

                return Ok(new { Status = "Success", Message = "User account created successfully! Please check your email to confirm your account." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during user registration");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Status = "Error", Message = "An unexpected error occurred during registration.", Error = ex.Message });
            }
        }

        [HttpGet]
        [Route("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
                return BadRequest("Invalid email confirmation token");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return BadRequest("Unable to find user");

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
                return Ok("Thank you for confirming your email. You can now log in to your account.");
            else
                return BadRequest("Error confirming your email.");
        }

        [HttpPost]
        [Route("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
                return Ok("If your email is registered and confirmed, you will receive a password reset link shortly.");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var frontendUrl = _configuration[$"FrontendUrls:{(_environment.IsDevelopment() ? "Development" : "Production")}"];
            var resetLink = $"{frontendUrl}/reset-password?email={WebUtility.UrlEncode(model.Email)}&token={encodedToken}";

            await SendEmailAsync(user.Email, "Reset your password", $"Please reset your password by clicking this link: <a href='{resetLink}'>Reset Password</a>");

            return Ok("If your email is registered and confirmed, you will receive a password reset link shortly.");
        }

        [HttpPost]
        [Route("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return BadRequest(new { message = "Invalid reset attempt." });

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (result.Succeeded)
                return Ok(new { message = "Your password has been reset successfully." });
            else
                return BadRequest(new { message = "Error resetting your password. Please try again.", errors = result.Errors.Select(e => e.Description) });
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

        private async Task SendEmailAsync(string email, string subject, string message)
        {
            var from = new EmailAddress(_configuration["SendGrid:FromEmail"], _configuration["SendGrid:FromName"]);
            var to = new EmailAddress(email);
            var plainTextContent = message;
            var htmlContent = message;
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            await _sendGridClient.SendEmailAsync(msg);
        }
    }


}
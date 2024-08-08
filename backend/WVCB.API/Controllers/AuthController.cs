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
using WVCB.API.Services;
using Microsoft.AspNetCore.Authorization;

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
        private readonly AuthService _authService;
        private readonly IEmailService _emailService;


        public AuthController(
            UserManager<IdentityUser<Guid>> userManager,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            ApplicationDbContext context,
            ISendGridClient sendGridClient,
            IWebHostEnvironment environment,
            AuthService authService,
            IEmailService emailService)
        {
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
            _context = context;
            _sendGridClient = sendGridClient;
            _environment = environment;
            _authService = authService;
            _emailService = emailService;
        }

        [HttpPost]
        [AllowAnonymous]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var result = await _authService.LoginAsync(
                model.Username,
                model.Password,
                Request.Headers["User-Agent"].ToString(),
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }

        [HttpPost]
        [Route("register")]
        [AllowAnonymous]

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

                await _emailService.SendEmailAsync(identityUser.Email, "Confirm your email", $"Please confirm your account by clicking this link: <a href='{confirmationLink}'>Confirm Email</a>");

                return Ok(new { Status = "Success", Message = "User account created successfully! Please check your email to confirm your account." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during user registration");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Status = "Error", Message = "An unexpected error occurred during registration.", Error = ex.Message });
            }
        }

        [HttpGet]
        [AllowAnonymous]
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
        [AllowAnonymous]
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

            await _emailService.SendEmailAsync(user.Email, "Reset your password", $"Please reset your password by clicking this link: <a href='{resetLink}'>Reset Password</a>");

            return Ok("If your email is registered and confirmed, you will receive a password reset link shortly.");
        }

        [HttpPost]
        [AllowAnonymous]
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

        [HttpGet]
        [Authorize]
        [Route("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await _authService.GetUserProfileAsync(User);
            if (user == null)
            {
                return NotFound("User profile not found.");
            }

            var session = new Session
            {
                User = user,
                // You might want to fill in other session details here if needed
            };

            return Ok(session);
        }
    }


}
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using WVCB.API.Data;
using WVCB.API.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
namespace WVCB.API.Services
{
    public class AuthService
    {
        private readonly UserManager<IdentityUser<Guid>> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly ApplicationUserManager _applicationUserManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly IEmailService _emailService;


        public AuthService(UserManager<IdentityUser<Guid>> userManager,
                           ApplicationDbContext context,
                           ApplicationUserManager applicationUserManager,
                           IConfiguration configuration,
                           ILogger<AuthService> logger,
                           IWebHostEnvironment environment,
                           IEmailService emailService)
        {
            _userManager = userManager;
            _context = context;
            _applicationUserManager = applicationUserManager;
            _configuration = configuration;
            _logger = logger;
            _environment = environment;
            _emailService = emailService;
        }

        public async Task<ApiResponse<Session>> LoginAsync(string username, string password, string userAgent, string ipAddress)
        {
            var identityUser = await _userManager.FindByNameAsync(username);
            if (identityUser == null || !await _userManager.CheckPasswordAsync(identityUser, password))
            {
                return ApiResponse<Session>.FailureResponse("Invalid username or password.");
            }

            if (!await _userManager.IsEmailConfirmedAsync(identityUser))
            {
                return ApiResponse<Session>.FailureResponse("Email not confirmed. Please check your email for the confirmation link.");
            }

            var applicationUser = await _applicationUserManager.FindByIdentityUserIdAsync(identityUser.Id);
            if (applicationUser == null)
            {
                return ApiResponse<Session>.FailureResponse("User account not found.");
            }

            if (applicationUser.Status != UserStatus.Active)
            {
                return ApiResponse<Session>.FailureResponse("Your account is not active. Please contact support.");
            }

            var token = await GenerateJwtTokenAsync(identityUser, applicationUser);

            var session = new Session
            {
                UserId = applicationUser.Id,
                ExpiresAt = token.ValidTo,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserAgent = userAgent,
                IpAddress = ipAddress,
                LastActive = DateTime.UtcNow,
                User = applicationUser,
                Token = new JwtSecurityTokenHandler().WriteToken(token)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            return ApiResponse<Session>.SuccessResponse(session, "Login successful.");
        }

        private async Task<JwtSecurityToken> GenerateJwtTokenAsync(IdentityUser<Guid> identityUser, ApplicationUser applicationUser)
        {
            var userRoles = await _userManager.GetRolesAsync(identityUser);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, identityUser.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("ApplicationUserId", applicationUser.Id.ToString()),
                new Claim(ClaimTypes.Role, applicationUser.Role.ToString())
            };

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));

            return new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
        }

        public async Task<ApiResponse<Session>> RegisterAsync(RegisterModel model, string userAgent, string ipAddress)
        {
            try
            {
                var identityUser = await _userManager.FindByNameAsync(model.Email);
                if (identityUser != null)
                    return new ApiResponse<Session> { Success = false, Message = "User account already exists!" };

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
                    var errors = result.Errors.Select(e => e.Description).ToList();
                    return new ApiResponse<Session> { Success = false, Message = "User account creation failed!", Errors = errors.ToArray() };
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

                // Create a session for the new user
                var session = new Session
                {
                    UserId = applicationUser.Id,
                    ExpiresAt = DateTime.UtcNow.AddHours(3), // Set expiration time as needed
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UserAgent = userAgent,
                    IpAddress = ipAddress,
                    LastActive = DateTime.UtcNow,
                    User = applicationUser
                };

                _context.Sessions.Add(session);
                await _context.SaveChangesAsync();

                var jwtToken = await GenerateJwtTokenAsync(identityUser, applicationUser);
                session.Token = new JwtSecurityTokenHandler().WriteToken(jwtToken);

                return new ApiResponse<Session>
                {
                    Success = true,
                    Message = "User account created successfully! Please check your email to confirm your account.",
                    Data = session
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during user registration");
                //errors hsould be an array
                return new ApiResponse<Session> { Success = false, Message = "An unexpected error occurred during registration.", Errors = new List<string> { ex.Message }.ToArray() };
            }
        }

        public async Task<ApiResponse<ApplicationUser>> GetUserProfileAsync(ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return new ApiResponse<ApplicationUser> { Success = false, Message = "User not found." };
            }

            var identityUser = await _userManager.FindByIdAsync(userId);
            if (identityUser == null)
            {
                return new ApiResponse<ApplicationUser> { Success = false, Message = "User not found." };
            }

            var applicationUser = await _applicationUserManager.FindByIdentityUserIdAsync(identityUser.Id);
            if (applicationUser == null)
            {
                return new ApiResponse<ApplicationUser> { Success = false, Message = "User profile not found." };
            }

            return new ApiResponse<ApplicationUser> { Success = true, Data = applicationUser };
        }
    }
}
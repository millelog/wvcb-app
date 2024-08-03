using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WVCB.API.Data;
using WVCB.API.Models;

namespace WVCB.API.Services
{
    public class ApplicationUserManager
    {
        private readonly ApplicationDbContext _context;

        public ApplicationUserManager(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApplicationUser> FindByEmailAsync(string email)
        {
            return await _context.ApplicationUsers
                .Include(u => u.Section)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<ApplicationUser> FindByIdentityUserIdAsync(Guid identityUserId)
        {
            return await _context.ApplicationUsers
                .Include(u => u.Section)
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);
        }

        public async Task<ApplicationUser> FindByIdAsync(Guid id)
        {
            return await _context.ApplicationUsers
                .Include(u => u.Section)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task CreateAsync(ApplicationUser user)
        {
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            _context.ApplicationUsers.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ApplicationUser user)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _context.ApplicationUsers.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ApplicationUser>> GetUsersInSectionAsync(Guid sectionId)
        {
            return await _context.ApplicationUsers
                .Where(u => u.SectionId == sectionId)
                .ToListAsync();
        }

        public async Task<List<ApplicationUser>> GetUsersByRoleAsync(UserRole role)
        {
            return await _context.ApplicationUsers
                .Where(u => u.Role == role)
                .ToListAsync();
        }

        public async Task UpdateUserRoleAsync(Guid userId, UserRole newRole)
        {
            var user = await FindByIdAsync(userId);
            if (user != null)
            {
                user.Role = newRole;
                await UpdateAsync(user);
            }
        }

        public async Task UpdateUserStatusAsync(Guid userId, UserStatus newStatus)
        {
            var user = await FindByIdAsync(userId);
            if (user != null)
            {
                user.Status = newStatus;
                await UpdateAsync(user);
            }
        }

        public async Task AssignUserToSectionAsync(Guid userId, Guid sectionId)
        {
            var user = await FindByIdAsync(userId);
            if (user != null)
            {
                user.SectionId = sectionId;
                await UpdateAsync(user);
            }
        }

        public async Task<List<ApplicationUser>> SearchUsersAsync(string searchTerm)
        {
            return await _context.ApplicationUsers
                .Where(u => u.FirstName.Contains(searchTerm) ||
                            u.LastName.Contains(searchTerm) ||
                            u.Email.Contains(searchTerm) ||
                            u.Instrument.Contains(searchTerm))
                .ToListAsync();
        }

        public async Task<bool> IsUserActiveAsync(Guid userId)
        {
            var user = await FindByIdAsync(userId);
            return user != null && user.Status == UserStatus.Active;
        }
    }
}
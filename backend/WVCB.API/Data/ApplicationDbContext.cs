using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WVCB.API.Models;

namespace WVCB.API.Data
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<ApplicationUser> ApplicationUsers { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<MusicPiece> MusicPieces { get; set; }
        public DbSet<EventMusicPiece> EventMusicPieces { get; set; }
        public DbSet<MailingListSubscriber> MailingListSubscribers { get; set; }
        public DbSet<Session> Sessions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ApplicationUser>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.IdentityUser)
                .WithOne()
                .HasForeignKey<ApplicationUser>(u => u.IdentityUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Section)
                .WithMany()
                .HasForeignKey(u => u.SectionId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Section>()
                .HasIndex(s => s.Name)
                .IsUnique();

            modelBuilder.Entity<Section>()
                .HasOne(s => s.Leader)
                .WithMany()
                .HasForeignKey(s => s.LeaderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MailingListSubscriber>()
                .HasIndex(m => m.Email)
                .IsUnique();

            // Enum to string conversions
            modelBuilder.Entity<ApplicationUser>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<ApplicationUser>()
                .Property(u => u.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Event>()
                .Property(e => e.Type)
                .HasConversion<string>();

            modelBuilder.Entity<Attendance>()
                .Property(a => a.Status)
                .HasConversion<string>();

            // Add more configurations as needed
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                var connectionString = Environment.GetEnvironmentVariable("POSTGRESQLURL");
                optionsBuilder.UseNpgsql(connectionString);
            }
        }
    }
}
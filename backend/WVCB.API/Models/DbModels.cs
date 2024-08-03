using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace WVCB.API.Models
{
    public class ApplicationUser
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string Instrument { get; set; }
        public UserRole Role { get; set; }
        public UserStatus Status { get; set; }
        public DateTime JoinDate { get; set; }
        public string EmergencyContactName { get; set; }
        public string EmergencyContactPhone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Guid? SectionId { get; set; }

        [ForeignKey("SectionId")]
        public virtual Section Section { get; set; }

        public Guid? IdentityUserId { get; set; }

        [ForeignKey("IdentityUserId")]
        public virtual IdentityUser<Guid> IdentityUser { get; set; }
    }

    public class Section
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        public Guid? LeaderId { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        [ForeignKey("LeaderId")]
        public virtual ApplicationUser Leader { get; set; }
    }
    public class Event
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public EventType Type { get; set; }
        [Required]
        public string Name { get; set; }
        public string Description { get; set; }
        [Required]
        public DateTime Date { get; set; }
        [Required]
        public TimeSpan StartTime { get; set; }
        [Required]
        public TimeSpan EndTime { get; set; }
        [Required]
        public string Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class Attendance
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        public Guid EventId { get; set; }
        [Required]
        public AttendanceStatus Status { get; set; }
        public string Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }
        [ForeignKey("EventId")]
        public virtual Event Event { get; set; }
    }

    public class MusicPiece
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Title { get; set; }
        [Required]
        public string Composer { get; set; }
        public string Arranger { get; set; }
        public string Genre { get; set; }
        public int? Difficulty { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class EventMusicPiece
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid EventId { get; set; }

        [Required]
        public Guid MusicPieceId { get; set; }

        public int? Order { get; set; }

        [ForeignKey("EventId")]
        public virtual Event Event { get; set; }

        [ForeignKey("MusicPieceId")]
        public virtual MusicPiece MusicPiece { get; set; }
    }

    public class MailingListSubscriber
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        public string Name { get; set; }
        [Required]
        public DateTime SubscribedAt { get; set; }
        [Required]
        public bool IsActive { get; set; }
    }

    public class Session
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        public DateTime ExpiresAt { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; }
        [Required]
        public DateTime UpdatedAt { get; set; }
        public string UserAgent { get; set; }
        public string IpAddress { get; set; }
        public DateTime? LastActive { get; set; }
        public string Data { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }
    }

    public enum UserRole
    {
        Admin,
        Board,
        Leader,
        Member,
        Guest
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        OnLeave
    }

    public enum EventType
    {
        Rehearsal,
        Concert,
        Meeting
    }

    public enum AttendanceStatus
    {
        Attending,
        NotAttending,
        Tentative
    }

    public class LoginModel
    {
        [Required(ErrorMessage = "User Name is required")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }
    }

    public class RegisterModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }
    }
}
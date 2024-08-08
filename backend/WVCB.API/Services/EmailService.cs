using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace WVCB.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string message, string htmlMessage = null);
    }

    public class EmailService : IEmailService
    {
        private readonly ISendGridClient _sendGridClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(ISendGridClient sendGridClient, IConfiguration configuration, ILogger<EmailService> logger)
        {
            _sendGridClient = sendGridClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string message, string htmlMessage = null)
        {
            try
            {
                var from = new EmailAddress(_configuration["SendGrid:FromEmail"], _configuration["SendGrid:FromName"]);
                var toAddress = new EmailAddress(to);
                var plainTextContent = message;
                var htmlContent = htmlMessage ?? message; // Use htmlMessage if provided, otherwise use message
                var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, plainTextContent, htmlContent);

                var response = await _sendGridClient.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Email sent successfully to {to}. Subject: {subject}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send email to {to}. Subject: {subject}. StatusCode: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while sending email to {to}. Subject: {subject}");
                throw;
            }
        }
    }
}
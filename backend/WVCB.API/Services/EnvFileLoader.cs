using System;
using System.IO;
using System.Text.RegularExpressions;
namespace WVCB.API.Services
{
    public static class EnvFileLoader
    {
        public static void LoadEnvFile(string filePath)
        {
            if (!File.Exists(filePath))
                return;

            foreach (var line in File.ReadAllLines(filePath))
            {
                var parts = line.Split(new[] { '=' }, 2, StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length != 2)
                    continue;

                string key = parts[0].Trim();
                string value = parts[1].Trim();

                // Remove surrounding quotes if present
                value = Regex.Replace(value, @"^[""](.*)[""]$", "$1");

                // Unescape any quotes within the value
                value = value.Replace("\\\"", "\"");

                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
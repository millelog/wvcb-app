After any model changes make sure to migrate the ef model to the databse

```
dotnet ef migrations add [MigrationLabel]
dotnet ef database update
```

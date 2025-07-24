# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["XTractFlowService.csproj", "."]
RUN dotnet restore "XTractFlowService.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "XTractFlowService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "XTractFlowService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create final runtime image
FROM base AS final
WORKDIR /app

# Create resources directory for XTractFlow
RUN mkdir -p /app/resources

# Copy published application
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV XTractFlow__ResourceFolder=/app/resources

ENTRYPOINT ["dotnet", "XTractFlowService.dll"]
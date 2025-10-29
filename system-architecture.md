# System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    Client[Client Application] --> API[Express.js API Server]
    
    API --> Controller[Controller Layer]
    Controller --> Service[Service Layer]
    Service --> DB[(MySQL Database)]
    Service --> External[External APIs]
    
    External --> CountriesAPI[REST Countries API]
    External --> ExchangeAPI[Exchange Rate API]
    
    Service --> ImageGen[Image Generation Service]
    ImageGen --> FileSystem[File System]
    
    API --> Middleware[Middleware Layer]
    Middleware --> Validation[Input Validation]
    Middleware --> ErrorHandling[Error Handling]
```

## Data Flow for Refresh Operation

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant CountryService
    participant ExchangeService
    participant ImageService
    participant Database
    participant CountriesAPI
    participant ExchangeAPI
    participant FileSystem
    
    Client->>API: POST /countries/refresh
    API->>Controller: handleRefresh()
    Controller->>CountryService: refreshCountryData()
    
    CountryService->>CountriesAPI: GET /v2/all?fields=...
    CountriesAPI-->>CountryService: Countries Data
    
    CountryService->>ExchangeAPI: GET /v6/latest/USD
    ExchangeAPI-->>CountryService: Exchange Rates
    
    CountryService->>CountryService: Process and merge data
    CountryService->>Database: Insert/Update countries
    
    CountryService->>ImageService: generateSummaryImage()
    ImageService->>Database: Get top 5 countries by GDP
    Database-->>ImageService: Top countries data
    ImageService->>ImageService: Create image with stats
    ImageService->>FileSystem: Save cache/summary.png
    
    CountryService->>Database: Update system status
    Database-->>CountryService: Confirmation
    
    CountryService-->>Controller: Success response
    Controller-->>API: Success response
    API-->>Client: Success response with updated data
```

## Database Schema

```mermaid
erDiagram
    COUNTRIES {
        int id PK
        varchar name UK
        varchar capital
        varchar region
        bigint population
        varchar currency_code
        decimal exchange_rate
        decimal estimated_gdp
        varchar flag_url
        timestamp last_refreshed_at
    }
    
    SYSTEM_STATUS {
        int id PK
        int total_countries
        timestamp last_refreshed_at
    }
    
    COUNTRIES ||--o{ SYSTEM_STATUS : updates
```

## API Endpoint Structure

```mermaid
graph LR
    subgraph "API Endpoints"
        A[POST /countries/refresh]
        B[GET /countries]
        C[GET /countries/:name]
        D[DELETE /countries/:name]
        E[GET /status]
        F[GET /countries/image]
    end
    
    subgraph "Query Parameters"
        B --> B1[?region=Africa]
        B --> B2[?currency=NGN]
        B --> B3[?sort=gdp_desc]
    end
    
    subgraph "Response Types"
        A --> A1[JSON with updated countries]
        B --> B1[JSON array of countries]
        C --> C1[JSON object of single country]
        D --> D1[Success confirmation]
        E --> E1[JSON with system status]
        F --> F1[Image file or error JSON]
    end
```

## Error Handling Flow

```mermaid
graph TD
    Request[Incoming Request] --> Validation{Input Validation}
    Validation -->|Valid| Processing[Process Request]
    Validation -->|Invalid| BadRequest[400 Bad Request]
    
    Processing --> ExternalAPI{External API Call?}
    ExternalAPI -->|Yes| APICall[Make API Call]
    ExternalAPI -->|No| Database[Database Operation]
    
    APICall --> APIResponse{API Response}
    APIResponse -->|Success| ProcessData[Process Data]
    APIResponse -->|Failure| ServiceUnavailable[503 Service Unavailable]
    
    ProcessData --> Database
    Database --> DBResponse{DB Operation}
    DBResponse -->|Success| Success[200/201 Success]
    DBResponse -->|NotFound| NotFound[404 Not Found]
    DBResponse -->|Error| InternalError[500 Internal Error]
    
    BadRequest --> ErrorResponse[Error Response]
    ServiceUnavailable --> ErrorResponse
    NotFound --> ErrorResponse
    InternalError --> ErrorResponse
    Success --> SuccessResponse[Success Response]
```

## Component Interaction

```mermaid
graph TB
    subgraph "Presentation Layer"
        Routes[Route Handlers]
        Middleware[Express Middleware]
    end
    
    subgraph "Business Logic Layer"
        CountryController[Country Controller]
        StatusController[Status Controller]
    end
    
    subgraph "Service Layer"
        CountryService[Country Service]
        ExchangeService[Exchange Rate Service]
        ImageService[Image Generation Service]
    end
    
    subgraph "Data Access Layer"
        CountryModel[Country Model]
        DatabaseConnection[DB Connection Pool]
    end
    
    subgraph "External Services"
        CountriesAPI[REST Countries API]
        ExchangeAPI[Exchange Rate API]
    end
    
    subgraph "Infrastructure"
        MySQL[(MySQL Database)]
        FileSystem[File System]
    end
    
    Routes --> CountryController
    Routes --> StatusController
    Middleware --> Routes
    
    CountryController --> CountryService
    StatusController --> CountryService
    
    CountryService --> CountryModel
    CountryService --> ExchangeService
    CountryService --> ImageService
    
    ExchangeService --> CountriesAPI
    ExchangeService --> ExchangeAPI
    
    CountryModel --> DatabaseConnection
    DatabaseConnection --> MySQL
    
    ImageService --> FileSystem
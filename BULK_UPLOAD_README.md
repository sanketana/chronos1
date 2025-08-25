# Faculty Bulk Upload Feature

## Overview
The bulk upload feature allows administrators to import multiple faculty members at once using tab-separated values (TSV) format.

## How to Use

### 1. Access the Feature
- Navigate to the Faculty dashboard
- Click the "📁 Bulk Upload" button (only visible to admin users)

### 2. Data Format
The data should be in tab-separated format with three columns:
- **Name**: Full name of the faculty member
- **Email**: Email address (must be valid format)
- **Department**: Department name

### 3. Example Data
```
John Doe	john.doe@university.edu	Computer Science
Jane Smith	jane.smith@university.edu	Mathematics
Michael Johnson	michael.johnson@university.edu	Physics
```

### 4. Process
1. **Input**: Paste your tab-separated data into the text area
2. **Process**: Click "Process Data" to validate the records
3. **Preview**: Review valid and invalid records before importing
4. **Import**: Click "Import Valid Records" to add faculty members
5. **Results**: View import statistics and any errors

## Validation Rules
- **Name**: Required, cannot be empty
- **Email**: Required, must be in valid email format
- **Department**: Required, cannot be empty
- **Duplicate Check**: System prevents importing faculty with existing email addresses

## Features
- **Real-time Validation**: Shows validation errors for each record
- **Preview Mode**: Review all records before importing
- **Error Handling**: Detailed error messages for failed imports
- **Transaction Safety**: Uses database transactions to ensure data integrity
- **Status Setting**: All imported faculty members are automatically set to "active" status

## Error Handling
The system handles various error scenarios:
- Invalid email formats
- Missing required fields
- Duplicate email addresses
- Database connection issues
- Malformed data

## Security
- Only admin users can access the bulk upload feature
- All data is validated before database insertion
- Database transactions ensure data consistency 
// Utility functions for downloading files

export const downloadFile = (content: string, filename: string, type: string = 'text/plain') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2)
  downloadFile(jsonString, filename, 'application/json')
}

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  downloadFile(csvContent, filename, 'text/csv')
}

export const generatePDFContent = (title: string, data: any) => {
  // Simple HTML content that can be converted to PDF
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .date { color: #666; font-size: 12px; }
        .content { margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="content">
        ${JSON.stringify(data, null, 2).replace(/\n/g, '<br>')}
      </div>
    </body>
    </html>
  `
}

export const downloadPDF = (content: string, filename: string) => {
  // For now, we'll download as HTML which can be printed to PDF
  // In a real app, you'd use a library like jsPDF or Puppeteer
  downloadFile(content, filename.replace('.pdf', '.html'), 'text/html')
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Format rows, escaping commas and quotes
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header] === null || row[header] === undefined ? '' : row[header];
      if (typeof value === 'string') {
        // Escape double quotes by doubling them, and wrap in quotes if there's a comma
        value = value.replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"`;
        }
      }
      return value;
    }).join(',');
  });

  // Combine headers and rows
  const csvString = [headers.join(','), ...csvRows].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

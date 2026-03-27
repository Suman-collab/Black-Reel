import { Edit, Trash2, Eye } from 'lucide-react';
import '../styles/DataTable.css';

const DataTable = ({ columns, data, actions, onAction }) => {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.label}</th>
            ))}
            {actions && actions.length > 0 && <th className="actions-header">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="actions-cell">
                  {actions.includes('view') && (
                    <button type="button" className="action-btn view" title="View Details" onClick={() => onAction?.('view', row)}>
                      <Eye size={16} />
                    </button>
                  )}
                  {actions.includes('edit') && (
                    <button type="button" className="action-btn edit" title="Edit" onClick={() => onAction?.('edit', row)}>
                      <Edit size={16} />
                    </button>
                  )}
                  {actions.includes('delete') && (
                    <button type="button" className="action-btn delete" title="Delete" onClick={() => onAction?.('delete', row)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <div className="no-data">No data available</div>}
    </div>
  );
};

export default DataTable;

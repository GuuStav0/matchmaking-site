// src/components/admin/Table.jsx
import { useState } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import { IEdit, ITrash, ISort } from "./AdminIcons.jsx";

export default function Table({ columns, data, onDelete, onEdit, isMock }) {
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    await onDelete(confirm);
    setDeleting(false);
    setConfirm(null);
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          msg="Excluir este registro? Esta ação é irreversível."
          onConfirm={confirmDelete}
          onClose={() => setConfirm(null)}
          loading={deleting}
        />
      )}
      {isMock && (
        <div className="mock-banner">
          ⚡ Exibindo dados de demonstração — inicie a API para dados reais
        </div>
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="tbl__th">
                  <span className="tbl__th-inner">
                    {col.label}{col.sortable !== false && <ISort />}
                  </span>
                </th>
              ))}
              <th className="tbl__th tbl__th--actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="tbl__empty">Nenhum registro encontrado</td></tr>
            ) : data.map((row, ri) => (
              <tr key={row.id ?? `${row.group_id}-${row.profile_id}`} className="tbl__row" style={{ animationDelay: `${ri * 30}ms` }}>
                {columns.map((col) => (
                  <td key={col.key} className="tbl__td">
                    {col.render ? col.render(row[col.key], row) : (
                      <span className={col.mono ? "tbl__mono" : ""}>
                        {row[col.key] === null || row[col.key] === undefined
                          ? <span className="tbl__null">—</span>
                          : String(row[col.key])}
                      </span>
                    )}
                  </td>
                ))}
                <td className="tbl__td tbl__td--actions">
                  <div className="tbl__action-btns">
                    {onEdit && (
                      <button className="tbl__btn tbl__btn--edit" title="Editar" onClick={() => onEdit(row)}>
                        <IEdit />
                      </button>
                    )}
                    <button className="tbl__btn tbl__btn--del" title="Excluir" onClick={() => setConfirm(row)}>
                      <ITrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

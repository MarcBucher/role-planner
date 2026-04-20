import { PageContainer } from '../components/layout/PageContainer';
import { TableCrudMatrix } from '../components/matrices/TableCrudMatrix';

export function TableCrudMatrixPage() {
  return (
    <PageContainer title="Tabellen CRUD-Rechte">
      <TableCrudMatrix />
    </PageContainer>
  );
}

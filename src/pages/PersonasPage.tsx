import { PageContainer } from '../components/layout/PageContainer';
import { PersonaList } from '../components/personas/PersonaList';

export function PersonasPage() {
  return (
    <PageContainer title="Personas">
      <PersonaList />
    </PageContainer>
  );
}

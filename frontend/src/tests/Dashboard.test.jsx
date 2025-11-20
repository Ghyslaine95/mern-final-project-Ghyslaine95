
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const MockDashboard = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  </QueryClientProvider>
);

test('displays user dashboard with stats', async () => {
  render(<MockDashboard />);
  
  await waitFor(() => {
    expect(screen.getByText(/carbon footprint/i)).toBeInTheDocument();
    expect(screen.getByText(/recent activities/i)).toBeInTheDocument();
  });
});
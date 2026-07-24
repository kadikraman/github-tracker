import { QueryClient } from '@tanstack/react-query';

// Shared by the main window and the menu bar popover (both React trees run
// in the same JS runtime), so fetched data and invalidations are shared.
export const queryClient = new QueryClient();

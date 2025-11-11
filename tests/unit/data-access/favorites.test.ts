import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listFavoriteProperties } from '@/lib/data-access/favorites';

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseSelect = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseOrder = vi.fn();
const mockSupabaseLimit = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    from: mockSupabaseFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      })
    }
  })
}));

describe('favorites data access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock chain
    mockSupabaseLimit.mockResolvedValue({ data: [], error: null });
    mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
    mockSupabaseEq.mockReturnValue({ order: mockSupabaseOrder });
    mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
    mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect });
  });

  describe('listFavoriteProperties', () => {
    it('should return empty array when no favorites exist', async () => {
      mockSupabaseLimit.mockResolvedValue({ data: [], error: null });

      const result = await listFavoriteProperties(10);

      expect(result).toEqual([]);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('favorites');
    });

    it('should return transformed property data', async () => {
      const mockData = [
        {
          property_id: 'prop-1',
          properties: {
            id: 'prop-1',
            title: 'Test Property',
            city: 'Toronto',
            price: 2000,
            bedrooms: 2,
            bathrooms: 1,
            images: ['image1.jpg'],
            slug: 'test-property',
            type: 'apartment',
            verified: true,
            pets: false,
            furnished: true,
            created_at: '2024-01-01T00:00:00Z'
          }
        }
      ];

      mockSupabaseLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await listFavoriteProperties(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'prop-1',
        title: 'Test Property',
        beds: 2,
        baths: 1,
        type: 'apartment'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseLimit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await listFavoriteProperties(10);

      expect(result).toEqual([]);
    });

    it('should apply limit parameter correctly', async () => {
      await listFavoriteProperties(25);

      expect(mockSupabaseLimit).toHaveBeenCalledWith(25);
    });

    it('should handle array properties correctly', async () => {
      const mockData = [
        {
          property_id: 'prop-1',
          properties: [{
            id: 'prop-1',
            title: 'Array Property',
            city: 'Toronto',
            price: 2000,
            bedrooms: 2,
            bathrooms: 1,
            images: ['image1.jpg'],
            slug: 'array-property',
            type: 'house',
            verified: false,
            pets: true,
            furnished: false,
            created_at: '2024-01-01T00:00:00Z'
          }]
        }
      ];

      mockSupabaseLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await listFavoriteProperties(10);

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Array Property');
    });
  });
});

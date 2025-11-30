import { describe, it, expect } from '@jest/globals';
import { buildSearchQuery, enrichSongsWithVideos } from '../frontend/server/youtube.js';

describe('youtube service', () => {
  describe('buildSearchQuery', () => {
    it('builds basic search query', () => {
      const query = buildSearchQuery('Shape of You', 'Ed Sheeran');
      expect(query).toBe('Ed Sheeran Shape of You official music video');
    });

    it('removes parenthetical content from title', () => {
      const query = buildSearchQuery('Bad Guy (Remix)', 'Billie Eilish');
      expect(query).toBe('Billie Eilish Bad Guy official music video');
    });

    it('removes multiple parenthetical sections', () => {
      const query = buildSearchQuery('Song (Remix) (feat. Artist)', 'Main Artist');
      expect(query).toBe('Main Artist Song official music video');
    });

    it('removes artist name after "Featuring"', () => {
      const query = buildSearchQuery('Wild Thoughts', 'DJ Khaled Featuring Rihanna');
      expect(query).toBe('DJ Khaled Wild Thoughts official music video');
    });

    it('handles "featuring" in lowercase', () => {
      const query = buildSearchQuery('Song', 'Artist featuring Guest');
      expect(query).toBe('Artist Song official music video');
    });

    it('removes artist name after ampersand', () => {
      const query = buildSearchQuery('Sucker', 'Jonas Brothers & Friends');
      expect(query).toBe('Jonas Brothers Sucker official music video');
    });

    it('takes first artist before comma', () => {
      const query = buildSearchQuery('Señorita', 'Shawn Mendes, Camila Cabello');
      expect(query).toBe('Shawn Mendes Señorita official music video');
    });

    it('handles multiple cleanup operations', () => {
      const query = buildSearchQuery('Song (Live Version)', 'Artist Featuring Guest, Other');
      expect(query).toBe('Artist Song official music video');
    });

    it('trims whitespace', () => {
      const query = buildSearchQuery('  Title  ', '  Artist  ');
      expect(query).toBe('Artist Title official music video');
    });

    it('handles empty parentheses', () => {
      const query = buildSearchQuery('Title ()', 'Artist');
      expect(query).toBe('Artist Title official music video');
    });

    it('preserves song title content outside parentheses', () => {
      const query = buildSearchQuery('Love Story', 'Taylor Swift');
      expect(query).toBe('Taylor Swift Love Story official music video');
    });
  });

  describe('enrichSongsWithVideos', () => {
    const mockSongs = [
      { rank: 1, title: 'Song One', artist: 'Artist One' },
      { rank: 2, title: 'Song Two', artist: 'Artist Two' },
      { rank: 3, title: 'Song Three', artist: 'Artist Three' }
    ];

    it('returns songs unchanged when no API key provided', async () => {
      const result = await enrichSongsWithVideos(mockSongs, null);
      expect(result).toEqual(mockSongs);
    });

    it('returns songs unchanged when undefined API key provided', async () => {
      const result = await enrichSongsWithVideos(mockSongs, undefined);
      expect(result).toEqual(mockSongs);
    });

    it('returns songs unchanged when empty API key provided', async () => {
      const result = await enrichSongsWithVideos(mockSongs, '');
      expect(result).toEqual(mockSongs);
    });

    it('returns songs unchanged when placeholder API key provided', async () => {
      const result = await enrichSongsWithVideos(mockSongs, 'your_youtube_api_key_here');
      expect(result).toEqual(mockSongs);
    });

    it('handles empty songs array', async () => {
      const result = await enrichSongsWithVideos([], 'valid-api-key');
      expect(result).toEqual([]);
    });

    it('preserves original song properties on pass-through', async () => {
      const songsWithExtra = [
        { rank: 1, title: 'Song', artist: 'Artist', cover: 'cover.jpg', position: { peak: 1 } }
      ];

      // Without API key, songs should be returned as-is
      const result = await enrichSongsWithVideos(songsWithExtra, null);

      expect(result[0].rank).toBe(1);
      expect(result[0].title).toBe('Song');
      expect(result[0].artist).toBe('Artist');
      expect(result[0].cover).toBe('cover.jpg');
      expect(result[0].position).toEqual({ peak: 1 });
    });

    it('returns correct array length for pass-through', async () => {
      const songs = Array.from({ length: 100 }, (_, i) => ({
        rank: i + 1,
        title: `Song ${i + 1}`,
        artist: `Artist ${i + 1}`
      }));

      const result = await enrichSongsWithVideos(songs, null);
      expect(result).toHaveLength(100);
    });
  });
});

// Simple, privacy-friendly analytics tracker for Movie Wallah
// Supports custom event tracking, local audit logging, and optional Google Analytics (gtag)

export interface AnalyticsEvent {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];

  track(event: string, details?: { category?: string; label?: string; value?: number; metadata?: Record<string, any> }) {
    const payload: AnalyticsEvent = {
      event,
      category: details?.category,
      label: details?.label,
      value: details?.value,
      metadata: details?.metadata,
      timestamp: new Date().toISOString()
    };

    this.events.push(payload);
    if (this.events.length > 100) this.events.shift();

    // Check for window.gtag
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', event, {
          event_category: details?.category,
          event_label: details?.label,
          value: details?.value,
          ...details?.metadata
        });
      } catch (e) {
        // silently ignore gtag failure
      }
    }
  }

  trackPageView(path: string) {
    this.track('page_view', { category: 'Navigation', label: path });
  }

  trackProviderClick(providerName: string, movieTitle: string, streamType: string) {
    this.track('provider_click', {
      category: 'Affiliate',
      label: `${providerName} - ${movieTitle}`,
      metadata: { provider: providerName, movie: movieTitle, type: streamType }
    });
  }

  trackMovieDetailView(movieTitle: string, movieId: string) {
    this.track('movie_detail_view', {
      category: 'Content',
      label: movieTitle,
      metadata: { movieId }
    });
  }

  trackSearch(query: string, resultCount: number) {
    this.track('search', {
      category: 'Search',
      label: query,
      value: resultCount
    });
  }
}

export const analytics = new AnalyticsTracker();

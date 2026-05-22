import ReactPixel from "react-facebook-pixel";

export const trackEvent = (eventName: string, data?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && window.fbq) {
    ReactPixel.track(eventName, data);
  }
};

// Standard events
export const trackPageView = () => {
  if (typeof window !== "undefined" && window.fbq) {
    ReactPixel.pageView();
  }
};

export const trackSignup = (method?: string) => {
  trackEvent("CompleteRegistration", { method });
};

export const trackLogin = (method?: string) => {
  trackEvent("Login", { method });
};

export const trackPurchase = (value: number, currency = "USD") => {
  trackEvent("Purchase", { value, currency });
};

export const trackInitiateCheckout = (planCode?: string) => {
  trackEvent("InitiateCheckout", { content_name: planCode });
};

export const trackViewContent = (contentName?: string) => {
  trackEvent("ViewContent", { content_name: contentName });
};

export const trackAddToCart = (planCode?: string, value?: number) => {
  trackEvent("AddToCart", { 
    content_name: planCode,
    value,
    currency: "USD"
  });
};

export const trackLead = (planCode?: string) => {
  trackEvent("Lead", { content_name: planCode });
};

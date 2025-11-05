/**
 * Redirects the user to the logout page, with a return URL to the sign-in page
 *
 * @param message The message to show on the login screen after logout
 */
export function logoutToSignIn(message?: string, returnToCurrentLocation: boolean = false) {
  // This function had to be moved to its own module so it could be used in the `http` wrapper without
  // causing issues with import order during the tests. We still want to share this logic as much as possible,
  // and it's good to have it accessible from locationStore. This way, we can have it present there, and
  // be able to use it in the `http` wrapper.
  const params = new URLSearchParams();
  if (message) {
    params.append("errorMsg", message);
  }
  if (returnToCurrentLocation) {
    params.append("original_url", window.location.pathname + window.location.search);
  }
  // Encode the return URL so it can be provided as a query parameter
  const returnUrl = encodeURIComponent(!!message || returnToCurrentLocation ? `/sign-in?${params.toString()}` : "/sign-in");
  window.location.href = `/logout?original_url=${returnUrl}`;
}

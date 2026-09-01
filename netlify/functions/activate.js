import { getStore } from "@netlify/blobs";

export default async (request) => {
  // Allow an easy browser test
  if (request.method === "GET") {
    return Response.json({
      success: true,
      message: "Activation server is working."
    });
  }

  // Only accept POST requests
  if (request.method !== "POST") {
    return Response.json(
      {
        success: false,
        message: "Method not allowed."
      },
      { status: 405 }
    );
  }

  try {
    const data = await request.json();

    const submittedKey = String(data.key || "")
      .trim()
      .toUpperCase();

    const deviceId = String(data.deviceId || "").trim();

    // Make sure the required information exists
    if (!submittedKey) {
      return Response.json(
        {
          success: false,
          message: "Please enter a licence key."
        },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return Response.json(
        {
          success: false,
          message: "Device ID is missing."
        },
        { status: 400 }
      );
    }

    /*
     * Read the private activation-key list
     * from the Netlify environment variable.
     *
     * Keys can be separated by commas or lines.
     */
    const rawKeys = process.env.ACTIVATION_KEYS || "";

    const validKeys = rawKeys
      .split(/[\n,]+/)
      .map(key => key.trim().toUpperCase())
      .filter(Boolean);

    /*
     * Check whether the submitted key
     * is one of your valid keys.
     */
    if (!validKeys.includes(submittedKey)) {
      return Response.json(
        {
          success: false,
          message: "Invalid licence key."
        },
        { status: 401 }
      );
    }

    /*
     * Open the persistent Netlify Blobs store.
     */
    const store = getStore("activation-keys");

    /*
     * Check whether this key has already
     * been redeemed.
     */
    const existing = await store.get(submittedKey, {
      type: "json",
      consistency: "strong"
    });

    if (existing !== null) {

      /*
       * The key has already been used.
       */
      return Response.json(
        {
          success: false,
          message: "This licence key has already been used."
        },
        { status: 409 }
      );
    }

    /*
     * Create a permanent activation token
     * for this activation.
     */
    const activationToken = crypto.randomUUID();

    /*
     * Store the redemption.
     *
     * onlyIfNew prevents two simultaneous
     * requests from successfully claiming
     * the same key.
     */
    const result = await store.set(
      submittedKey,
      JSON.stringify({
        key: submittedKey,
        deviceId: deviceId,
        activationToken: activationToken,
        activatedAt: new Date().toISOString()
      }),
      {
        onlyIfNew: true
      }
    );

    /*
     * If another request claimed the key
     * first, reject this request.
     */
    if (!result.modified) {
      return Response.json(
        {
          success: false,
          message: "This licence key has already been used."
        },
        { status: 409 }
      );
    }

    /*
     * Activation succeeded.
     */
    return Response.json({
      success: true,
      message: "Licence activated successfully.",
      activationToken: activationToken
    });

  } catch (error) {

    console.error("Activation error:", error);

    return Response.json(
      {
        success: false,
        message: "The activation server encountered an error."
      },
      { status: 500 }
    );
  }
};
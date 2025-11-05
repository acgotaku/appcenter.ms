import * as React from "react";
import { trim } from "lodash";
const md5 = require("md5");

enum Validity {
  VALID,
  INVALID,
  LOADING,
}

interface CachedGravatar {
  value: string;
  expiry: number;
}

const USERS_WITHOUT_AVATAR = "users-without-avatar"; // LocalStorage item key
const TIME_TO_LIVE = 60 * 60 * 1000; // 1 hour, defines how long gravatar will be stored in LocalStorage

// Store gravatars in LocalStorage to reduce amount of requests to gravatar.com
function isUserWithoutAvatar(gravatarEmailHash: string): boolean {
  try {
    const storedGravatars: CachedGravatar[] = JSON.parse(window.localStorage?.getItem(USERS_WITHOUT_AVATAR) || "[]");
    const isGravatarInStorage = storedGravatars.some((gravatar) => {
      const hashMatched = gravatar.value === gravatarEmailHash;
      const notExpired = gravatar.expiry > Date.now();
      return hashMatched && notExpired;
    });
    return isGravatarInStorage;
  } catch (err) {
    console.warn(
      "Oops! Looks like localStorage isn't available in your browser. Please update your browser settings to turn on localStorage."
    );
    return false;
  }
}

function addUserWithoutAvatarToCache(gravatarEmailHash: string, ttl: number) {
  try {
    const storedGravatars: CachedGravatar[] = JSON.parse(window.localStorage?.getItem(USERS_WITHOUT_AVATAR) || "[]");
    const validGravatars = storedGravatars.filter((gravatar) => gravatar.expiry > Date.now());

    const gravatarAlreadyStored = validGravatars.some((gravatar) => gravatar.value === gravatarEmailHash);
    if (!gravatarAlreadyStored) {
      const gravatarToStore: CachedGravatar = {
        value: gravatarEmailHash,
        expiry: Date.now() + ttl,
      };
      validGravatars.push(gravatarToStore);
    }

    window.localStorage.setItem(USERS_WITHOUT_AVATAR, JSON.stringify(validGravatars));
  } catch (err) {
    console.warn(
      "Oops! Looks like localStorage isn't available in your browser. Please update your browser settings to turn on localStorage."
    );
  }
}

function getGravatarHash(email: string): string {
  const gravatarEmail = trim(email).toLowerCase();
  const emailHash = gravatarEmail.includes("@") ? md5(gravatarEmail) : gravatarEmail;
  // if we know user does not have avatar, we return empty string to not fetch avatar again
  return isUserWithoutAvatar(emailHash) ? "" : emailHash;
}

function useGravatar(email: string, size: number): { isLoading: boolean; gravatarUrl: string | undefined } {
  const [gravatarValidity, setGravatarValidity] = React.useState<Validity>(Validity.LOADING);

  const gravatarHash = getGravatarHash(email);
  const shouldDownloadGravatar = !!gravatarHash; // only try to download if gravatarHash is not in USERS_WITHOUT_AVATAR cache and thus empty
  const gravatarUrl = `https://secure.gravatar.com/avatar/${gravatarHash}?s=${size}&d=404`;
  React.useEffect(() => {
    // Prevent the component from unmounting while setting state
    let isComponentMounted = true;
    if (shouldDownloadGravatar) {
      fetch(gravatarUrl, { method: "HEAD" })
        .then((response) => {
          if (isComponentMounted) {
            if (response.status !== 404) {
              setGravatarValidity(Validity.VALID);
            } else {
              throw "Avatar was not found!";
            }
          }
        })
        .catch(() => {
          if (isComponentMounted) {
            addUserWithoutAvatarToCache(gravatarHash, TIME_TO_LIVE);
            setGravatarValidity(Validity.INVALID);
          }
        });
    } else {
      setGravatarValidity(Validity.INVALID);
    }

    return () => {
      isComponentMounted = false;
    };
  }, [gravatarHash, shouldDownloadGravatar, gravatarUrl]);

  return {
    isLoading: gravatarValidity === Validity.LOADING,
    gravatarUrl: gravatarValidity === Validity.VALID ? gravatarUrl : undefined,
  };
}

export { useGravatar };

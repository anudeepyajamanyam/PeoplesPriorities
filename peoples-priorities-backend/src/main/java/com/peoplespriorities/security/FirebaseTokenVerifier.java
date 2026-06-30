package com.peoplespriorities.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around the Firebase Admin SDK token verification call.
 * Exists as a Spring bean so it can be mocked in tests.
 *
 * @see FirebaseTokenFilter
 */
@Component
@Slf4j
public class FirebaseTokenVerifier {

    /**
     * Verifies a raw Firebase ID token.
     *
     * @param idToken the Bearer token from the Authorization header
     * @return decoded token containing uid, email, and claims
     * @throws Exception if the token is invalid, expired, or Firebase is not initialised
     */
    public FirebaseToken verify(String idToken) throws Exception {
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }
}

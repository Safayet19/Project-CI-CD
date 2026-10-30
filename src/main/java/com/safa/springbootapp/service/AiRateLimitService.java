package com.safa.springbootapp.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AiRateLimitService {
    private static final int MAX_BURST_REQUESTS = 20;
    private static final long RATE_LIMIT_WINDOW_MILLIS = Duration.ofSeconds(10).toMillis();

    private final Set<String> trustedProxyAddresses;
    private final ConcurrentHashMap<String, RequestWindow> requestWindows = new ConcurrentHashMap<>();
    private final AtomicLong rateLimitChecks = new AtomicLong();

    public AiRateLimitService(
        @Value("${safayet.bot.trusted-proxies:127.0.0.1,::1}") List<String> trustedProxies) {
        trustedProxyAddresses = trustedProxies.stream()
            .map(AiRateLimitService::normalizeIpAddress)
            .filter(address -> address != null)
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    public boolean allowRequest(HttpServletRequest request) {
        String clientAddress = clientAddress(request);
        long now = System.currentTimeMillis();
        boolean[] allowed = {false};
        requestWindows.compute(clientAddress, (address, window) -> {
            if (window == null) window = new RequestWindow();
            window.removeExpired(now);
            if (window.timestamps.size() < MAX_BURST_REQUESTS) {
                window.timestamps.addLast(now);
                allowed[0] = true;
            }
            return window;
        });

        if (rateLimitChecks.incrementAndGet() % 256 == 0) {
            requestWindows.forEach((address, window) -> requestWindows.computeIfPresent(address,
                (key, current) -> {
                    current.removeExpired(now);
                    return current.timestamps.isEmpty() ? null : current;
                }));
        }
        return allowed[0];
    }

    private String clientAddress(HttpServletRequest request) {
        String remoteAddress = normalizeIpAddress(request.getRemoteAddr());
        if (remoteAddress == null || !trustedProxyAddresses.contains(remoteAddress)) {
            return remoteAddress == null ? "unknown" : remoteAddress;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (!StringUtils.hasText(forwardedFor)) {
            String realAddress = normalizeIpAddress(request.getHeader("X-Real-IP"));
            return realAddress == null ? remoteAddress : realAddress;
        }

        String[] addresses = forwardedFor.split(",");
        for (int index = addresses.length - 1; index >= 0; index--) {
            String address = normalizeIpAddress(addresses[index]);
            if (address == null) return remoteAddress;
            if (!trustedProxyAddresses.contains(address)) return address;
        }
        return remoteAddress;
    }

    private static String normalizeIpAddress(String address) {
        if (!StringUtils.hasText(address)) return null;
        String candidate = address.trim();
        if (!candidate.matches("[0-9a-fA-F:.]+")) return null;
        try {
            return InetAddress.getByName(candidate).getHostAddress().toLowerCase(Locale.ROOT);
        } catch (UnknownHostException error) {
            return null;
        }
    }

    private static final class RequestWindow {
        private final ArrayDeque<Long> timestamps = new ArrayDeque<>();

        private void removeExpired(long now) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() >= RATE_LIMIT_WINDOW_MILLIS) {
                timestamps.removeFirst();
            }
        }
    }
}

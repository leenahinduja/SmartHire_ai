package com.cs.SmartHireAi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/interview/signal")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SignalingController {

    // Room signaling message store (in-memory, real-time)
    private final Map<String, List<Map<String, Object>>> roomSignals = new ConcurrentHashMap<>();

    @PostMapping("/{roomKey}")
    public ResponseEntity<?> postSignal(@PathVariable String roomKey, @RequestBody Map<String, Object> signalData) {
        roomSignals.putIfAbsent(roomKey, new CopyOnWriteArrayList<>());
        List<Map<String, Object>> signals = roomSignals.get(roomKey);

        signalData.put("timestamp", System.currentTimeMillis());
        signals.add(signalData);

        // Keep last 100 signals in room
        if (signals.size() > 100) {
            signals.remove(0);
        }

        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    @GetMapping("/{roomKey}")
    public ResponseEntity<?> getSignals(@PathVariable String roomKey, @RequestParam(defaultValue = "0") long since) {
        List<Map<String, Object>> signals = roomSignals.getOrDefault(roomKey, Collections.emptyList());
        List<Map<String, Object>> newSignals = new ArrayList<>();

        for (Map<String, Object> s : signals) {
            Long ts = (Long) s.get("timestamp");
            if (ts != null && ts > since) {
                newSignals.add(s);
            }
        }

        return ResponseEntity.ok(newSignals);
    }

    @DeleteMapping("/{roomKey}")
    public ResponseEntity<?> clearRoom(@PathVariable String roomKey) {
        roomSignals.remove(roomKey);
        return ResponseEntity.ok(Map.of("status", "cleared"));
    }
}

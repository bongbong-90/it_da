package com.project.itda.domain.social.controller;

import com.project.itda.domain.auth.dto.SessionUser;
import com.project.itda.domain.social.entity.ChatRoom;
import com.project.itda.domain.social.service.ChatRoomService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social/chat")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final HttpSession httpSession;

    // 방 생성: 세션의 유저 이메일을 Service에 넘겨 DB 저장
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoom> createRoom(@RequestBody Map<String, String> params) {
        SessionUser user = (SessionUser) httpSession.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).build();

        String roomName = params.get("roomName");
        // Service 내부에서 유저 조회 후 Room과 Participant를 생성함
        ChatRoom room = chatRoomService.createChatRoom(roomName);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoom>> getRooms() {
        return ResponseEntity.ok(chatRoomService.findAllRooms());
    }
}
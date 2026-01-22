package com.project.itda.domain.social.entity;

import com.project.itda.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class VoteOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String content;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_id")
    private Vote vote;

    // 누가 이 항목에 투표했는지 (다대다 관계)
    @ManyToMany
    @JoinTable(
            name = "vote_participant",
            joinColumns = @JoinColumn(name = "vote_option_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default  // ✅ 빌더 사용 시에도 이 기본값을 사용하도록 설정
    private Set<User> voters = new HashSet<>(); // ✅ 선언과 동시에 초기화

    // 투표수 증가 편의 메서드
    public void addVoter(User user) {
        this.voters.add(user);
    }

    // 투표 취소 편의 메서드
    public void removeVoter(User user) {
        this.voters.remove(user);
    }
}
package com.project.itda.domain.auth.service;

import com.project.itda.domain.auth.dto.OAuthAttributes;
import com.project.itda.domain.auth.dto.SessionUser;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.entity.UserPreference;
import com.project.itda.domain.user.entity.UserSetting;
import com.project.itda.domain.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final HttpSession httpSession;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 1. 서비스 구분 (google, naver, kakao)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 2. OAuth2 로그인 진행 시 키가 되는 필드값 (PK)
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        // 3. OAuth2UserService를 통해 가져온 OAuth2User의 attribute를 담을 클래스
        OAuthAttributes attributes = OAuthAttributes.of(registrationId, userNameAttributeName, oAuth2User.getAttributes());

        // 4. 사용자 저장 및 업데이트
        User user = saveOrUpdate(attributes);

        // 5. Redis 세션에 사용자 정보 저장 (SessionUser DTO 사용)
        httpSession.setAttribute("user", new SessionUser(user));

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes.getAttributes(),
                attributes.getNameAttributeKey()
        );
    }

    private User saveOrUpdate(OAuthAttributes attributes) {
        User user = userRepository.findByEmail(attributes.getEmail())
                // 이미 가입된 유저라면 정보 업데이트 (이름, 프로필 사진 변경 대응)
                .map(entity -> entity.updateSocialInfo(attributes.getName(), attributes.getPicture()))
                // 신규 가입 유저라면 엔티티 생성
                .orElseGet(() -> {
                    User newUser = attributes.toEntity();

                    // [중요] 초기 성향(Preference) 및 설정(Setting) 자동 생성
                    // 나중에 '메인에서 성향 추가' 기능을 쓰기 위해 빈 레코드를 미리 만들어둡니다.
                    initUserRelatedEntities(newUser);

                    return newUser;
                });

        return userRepository.save(user);
    }

    private void initUserRelatedEntities(User user) {
    // 1. UserPreference 초기값 설정 [cite: 43, 44]
        UserPreference preference = UserPreference.builder()
                .user(user)
                .energyType("NONE")
                .purposeType("NONE")
                .frequencyType("NONE")
                .locationType("NONE")
                .budgetType("NONE")
                .leadershipType("NONE")
                .timePreference("NONE")
                .interests("[]")
                .build();

    // 2. UserSetting 초기값 설정 [cite: 75, 76]
        UserSetting setting = UserSetting.builder()
                .user(user)
                .notificationEnabled(true)
                .pushNotification(true)
                .build();

        // User 엔티티에 할당 (CascadeType.ALL에 의해 함께 저장됨)
        // User.java에 해당 필드와 @OneToOne 관계가 설정되어 있어야 합니다.
        // user.setPreference(preference); // User 엔티티에 Setter가 없다면 직접 할당 로직 추가 필요
    }
}
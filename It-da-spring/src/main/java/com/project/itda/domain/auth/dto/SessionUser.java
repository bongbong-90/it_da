package com.project.itda.domain.auth.dto;

import com.project.itda.domain.user.entity.User;
import lombok.Getter;
import java.io.Serializable;

@Getter
public class SessionUser implements Serializable {
    private String name;
    private String email;
    private String picture;

    public SessionUser(User user) {
        this.name = user.getUsername();
        this.email = user.getEmail();
        this.picture = user.getProfileImageUrl();
    }
}
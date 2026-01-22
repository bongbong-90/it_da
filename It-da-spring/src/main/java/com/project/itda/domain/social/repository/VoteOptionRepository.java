package com.project.itda.domain.social.repository;

import com.project.itda.domain.social.entity.VoteOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteOptionRepository extends JpaRepository<VoteOption, Long> {
}
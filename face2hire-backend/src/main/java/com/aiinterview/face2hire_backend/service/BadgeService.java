package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.BadgeDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface BadgeService {
    List<BadgeDto> getAllBadges();
    Page<BadgeDto> getBadgesByType(String type, int page, int size);
    BadgeDto createBadge(BadgeDto dto);
    BadgeDto updateBadge(Long id, BadgeDto dto);
    void deleteBadge(Long id);
    List<BadgeDto> getUserBadges(Long userId);
    void awardBadgeToUser(Long userId, Long badgeId);
    void checkAndAwardBadges(Long userId);
}

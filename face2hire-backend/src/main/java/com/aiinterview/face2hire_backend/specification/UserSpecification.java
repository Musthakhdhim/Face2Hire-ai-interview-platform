package com.aiinterview.face2hire_backend.specification;

import com.aiinterview.face2hire_backend.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;


public class UserSpecification {

    public static Specification<User> filterBy(
            String search, String role, Boolean isActive
    ) {
        return (root, query , cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate userNamePredicate = cb.like(cb.lower(root.get("userName")), searchPattern);
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), searchPattern);
                predicates.add(cb.or(userNamePredicate, emailPredicate));
            }

            if (StringUtils.hasText(role)) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

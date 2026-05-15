package com.aiinterview.face2hire_backend.security;


import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username);

        if (user == null) {
            user = userRepository.findByUserName(username);
        }

        if (user == null) {
            log.error("user not found in the database: {}", username);
            throw new UserNotFoundException("user with " + username + " not found");
        }
        return new CustomUserDetails(user);
    }

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}

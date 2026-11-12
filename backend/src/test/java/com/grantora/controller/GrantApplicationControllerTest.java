package com.grantora.controller;

import com.grantora.service.GrantApplicationService;
import com.grantora.entity.GrantApplicationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class GrantApplicationControllerTest {

    private GrantApplicationService applicationService;
    private GrantApplicationController controller;

    @BeforeEach
    void setUp() {
        applicationService = mock(GrantApplicationService.class);
        controller = new GrantApplicationController(applicationService);
    }

    @Test
    void adminCanListAllApplicationsWithPaginationAndStatusFilter() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "admin@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        var pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "id"));
        when(applicationService.getAdminApplications(
                null, pageable)).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        controller.getAdminApplications(authentication, null, pageable);

        verify(applicationService).getAdminApplications(null, pageable);
    }

    @Test
    void adminStatusFilterIsPassedToThePersistedApplicationQuery() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "admin@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        var pageable = PageRequest.of(1, 10, Sort.by(Sort.Direction.DESC, "id"));
        when(applicationService.getAdminApplications(
                GrantApplicationStatus.SUBMITTED, pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        controller.getAdminApplications(
                authentication, GrantApplicationStatus.SUBMITTED, pageable);

        verify(applicationService).getAdminApplications(
                GrantApplicationStatus.SUBMITTED, pageable);
    }

    @Test
    void nonAdminCannotAccessAdminApplicationListing() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "beneficiary@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_BENEFICIARY")));

        assertThrows(
                AccessDeniedException.class,
                () -> controller.getAdminApplications(
                        authentication, null, PageRequest.of(0, 20)));

        verifyNoInteractions(applicationService);
    }
}

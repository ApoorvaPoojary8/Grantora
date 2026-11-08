package com.grantora.controller;

import com.grantora.dto.VerificationRoutingRuleRequest;
import com.grantora.entity.VerificationRoutingRule;
import com.grantora.service.VerificationRoutingRuleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/verification/routing-rules")
public class VerificationRoutingRuleController {

    private final VerificationRoutingRuleService ruleService;

    public VerificationRoutingRuleController(VerificationRoutingRuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    public List<VerificationRoutingRule> getRules() {
        return ruleService.getRules();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VerificationRoutingRule create(@Valid @RequestBody VerificationRoutingRuleRequest request) {
        return ruleService.create(request);
    }

    @PutMapping("/{id}")
    public VerificationRoutingRule update(
            @PathVariable Long id,
            @Valid @RequestBody VerificationRoutingRuleRequest request) {
        return ruleService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        ruleService.delete(id);
    }
}

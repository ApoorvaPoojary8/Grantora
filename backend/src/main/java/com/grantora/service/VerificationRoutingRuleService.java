package com.grantora.service;

import com.grantora.dto.VerificationRoutingRuleRequest;
import com.grantora.entity.VerificationRoutingRule;
import com.grantora.repository.VerificationRoutingRuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class VerificationRoutingRuleService {

    private final VerificationRoutingRuleRepository ruleRepository;

    public VerificationRoutingRuleService(
            VerificationRoutingRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    @Transactional(readOnly = true)
    public List<VerificationRoutingRule> getRules() {
        return ruleRepository.findAllByOrderByIdAsc();
    }

    public VerificationRoutingRule create(VerificationRoutingRuleRequest request) {
        validate(request, null);
        return ruleRepository.save(toEntity(new VerificationRoutingRule(), request));
    }

    public VerificationRoutingRule update(
            Long id, VerificationRoutingRuleRequest request) {
        VerificationRoutingRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Routing rule not found"));
        validate(request, id);
        return ruleRepository.save(toEntity(rule, request));
    }

    public void delete(Long id) {
        if (!ruleRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Routing rule not found");
        }
        ruleRepository.deleteById(id);
    }

    private void validate(VerificationRoutingRuleRequest request, Long excludedId) {
        if (request.minimumScore().compareTo(request.maximumScore()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Minimum score must not exceed maximum score");
        }
        if (request.maximumAmount() != null
                && request.minimumAmount().compareTo(request.maximumAmount()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Minimum amount must not exceed maximum amount");
        }
        for (VerificationRoutingRule existing : ruleRepository.findAll()) {
            if (existing.getId().equals(excludedId)) continue;
            if (intersects(request.minimumScore(), request.maximumScore(),
                    existing.getMinimumScore(), existing.getMaximumScore())
                    && intersects(request.minimumAmount(), request.maximumAmount(),
                    existing.getMinimumAmount(), existing.getMaximumAmount())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Routing rule ranges overlap an existing rule");
            }
        }
    }

    private boolean intersects(
            BigDecimal minimumA, BigDecimal maximumA,
            BigDecimal minimumB, BigDecimal maximumB) {
        boolean aEndsBeforeB = maximumA != null && maximumA.compareTo(minimumB) < 0;
        boolean bEndsBeforeA = maximumB != null && maximumB.compareTo(minimumA) < 0;
        return !aEndsBeforeB && !bEndsBeforeA;
    }

    private VerificationRoutingRule toEntity(
            VerificationRoutingRule rule, VerificationRoutingRuleRequest request) {
        rule.setMinimumScore(request.minimumScore());
        rule.setMaximumScore(request.maximumScore());
        rule.setMinimumAmount(request.minimumAmount());
        rule.setMaximumAmount(request.maximumAmount());
        rule.setPriority(request.priority());
        rule.setStateApprovalRequired(
                request.stateApprovalRequired() == null
                        || request.stateApprovalRequired());
        return rule;
    }
}

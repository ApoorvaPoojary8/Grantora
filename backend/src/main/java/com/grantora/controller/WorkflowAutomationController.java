package com.grantora.controller;
import com.grantora.entity.*;import com.grantora.service.WorkflowAutomationService;import org.springframework.security.core.Authentication;import org.springframework.security.core.GrantedAuthority;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequestMapping("/api/workflow") public class WorkflowAutomationController {
 private final WorkflowAutomationService service; public WorkflowAutomationController(WorkflowAutomationService s){service=s;}
 @GetMapping("/deadlines") public WorkflowDeadlineConfig deadlines(){return service.config();}
 @PutMapping("/deadlines") public WorkflowDeadlineConfig update(@RequestBody WorkflowDeadlineConfig c){return service.update(c);}
 @GetMapping("/escalations") public List<WorkflowEscalation> escalations(Authentication a){return service.escalations(a.getName(),has(a,"ROLE_ADMIN"));}
 @PostMapping("/escalations/{id}/resolve") public WorkflowEscalation resolve(@PathVariable Long id,Authentication a){return service.resolve(id,a.getName());}
 @GetMapping("/notifications") public Map<String,Object> notifications(Authentication a){return Map.of("unreadCount",service.unread(a.getName()),"items",service.notifications(a.getName()));}
 @PostMapping("/notifications/{id}/read") public void read(@PathVariable Long id,Authentication a){service.markRead(id,a.getName());}
 private boolean has(Authentication a,String r){return a.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(r::equals);}
}

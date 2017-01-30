package distributedsystemsproject.controller;

import distributedsystemsproject.domain.Operation;
import distributedsystemsproject.repository.OperationRepository;
import distributedsystemsproject.service.CalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class DefaultController {

  @Autowired
  private OperationRepository operationRepository;

  @RequestMapping("/")
  public String home(Model model) {
    model.addAttribute("operations", operationRepository.findAll());
    return "index";
  }

  @RequestMapping(name = "/calculate", method = RequestMethod.GET)
  public String calculate(Model model, @RequestParam String arg1, @RequestParam String arg2, @RequestParam String op) {
    try {
      Operation operation = new Operation(Double.parseDouble(arg1), Double.parseDouble(arg2), op, CalculationService.calculate(arg1, arg2, op));
      operationRepository.save(operation);
    } catch (Exception e) {
      model.addAttribute("feedback", e.getMessage());
    }
    model.addAttribute("operations", operationRepository.findAll());
    return "index";
  }
}

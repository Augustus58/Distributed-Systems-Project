package distributedsystemsproject.controller;

import distributedsystemsproject.domain.Operation;
import distributedsystemsproject.repository.OperationRepository;
import distributedsystemsproject.service.CalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class DefaultController {

  @Autowired
  private OperationRepository operationRepository;

  @RequestMapping("/index")
  public String home() {
    return "index";
  }

//  @RequestMapping(name = "/calculate", method = RequestMethod.GET)
//  @ResponseBody
//  public Operation calculate(@RequestParam String arg1, @RequestParam String arg2, @RequestParam String op) {
//    Operation operation = new Operation();
//    try {
//      operation = new Operation(Double.parseDouble(arg1), Double.parseDouble(arg2), op, CalculationService.calculate(arg1, arg2, op));
//    } catch (Exception e) {
//      operation.setError(e.getMessage());
//    }
//    return operation;
//  }
}

package distributedsystemsproject.controller;

import distributedsystemsproject.service.SinService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sin")
public class SinController {

  @RequestMapping(method = RequestMethod.GET)
  @ResponseBody
  public SinCalculationResult CalculateSin(@RequestParam String command) {
    try {
      return new SinCalculationResult(SinService.CalculateSin(command));
    } catch (Exception e) {
      return new SinCalculationResult(0.0);
    }
  }

  public class SinCalculationResult {

    public Double res;

    public SinCalculationResult(Double res) {
      this.res = res;
    }

    public Double getRes() {
      return res;
    }

    public void setRes(Double res) {
      this.res = res;
    }

  }

  private ResponseEntity<byte[]> createResponseEntity(String contentType, Long contentLength, byte[] content) {
    final HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType(contentType));
    headers.setContentLength(contentLength);
    headers.setCacheControl("public");
    headers.setExpires(Long.MAX_VALUE);
    return new ResponseEntity<>(content, headers, HttpStatus.CREATED);
  }

}
